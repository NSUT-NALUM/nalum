const mongoose = require('mongoose');
const Conversation = require('../../models/chat/conversations.model');
const Connection = require('../../models/chat/connections.model');
const Message = require('../../models/chat/messages.model');
const Profile = require('../../models/user/profile.model');
const redisClient = require('../../config/redis.config'); // Fixed import to match previous fix

// Get all conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: userId,
      [`archived.${userId}`]: { $ne: true },
      [`deletedBy.${userId}`]: { $ne: true }
    })
      .populate('participants', 'name email profilePicture')
      .populate('lastMessage.sender', 'name')
      .sort({ 'lastMessage.timestamp': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get all participant IDs to fetch profiles
    const participantIds = [...new Set(conversations.flatMap(c => c.participants.map(p => p._id)))];

    // Fetch profiles for all participants
    const profiles = await Profile.find({ user: { $in: participantIds } })
      .select('user profile_picture');

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile.profile_picture;
      return acc;
    }, {});

    // Batch unread counts for all conversations in one aggregate
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map(c => c._id) },
          sender: { $ne: userObjectId },
          'readBy.user': { $ne: userObjectId },
          deleted: { $ne: true }
        }
      },
      { $group: { _id: '$conversation', count: { $sum: 1 } } }
    ]);
    const unreadMap = unreadAgg.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    // Collect other participant IDs for a single batch connection lookup
    const otherParticipantIds = conversations.map(conv =>
      conv.participants.find(p => p._id.toString() !== userId.toString())?._id
    ).filter(Boolean);

    const connectionDocs = await Connection.find({
      $or: [
        { requester: userId, recipient: { $in: otherParticipantIds } },
        { requester: { $in: otherParticipantIds }, recipient: userId }
      ]
    });
    const connectionMap = connectionDocs.reduce((acc, conn) => {
      const otherId = conn.requester.toString() === userId.toString()
        ? conn.recipient.toString()
        : conn.requester.toString();
      acc[otherId] = conn;
      return acc;
    }, {});

    // Build response — synchronous now that all data is pre-fetched
    const conversationsRaw = conversations.map(conv => {
      const participantsWithPics = conv.participants.map(p => ({
        ...p.toObject(),
        profile_picture: profileMap[p._id.toString()]
      }));

      const otherParticipant = participantsWithPics.find(
        p => p._id.toString() !== userId.toString()
      );

      if (!otherParticipant) return null;

      const unreadCount = unreadMap[conv._id.toString()] || 0;
      const connection = connectionMap[otherParticipant._id.toString()] || null;

      return {
        ...conv.toObject(),
        participants: participantsWithPics,
        otherParticipant,
        unreadCount,
        connectionStatus: connection ? connection.status : 'none',
        connectionRequester: connection ? connection.requester : null,
        connectionId: connection ? connection._id : null,
        blockedBy: connection ? connection.blockedBy : null
      };
    });
    const conversationsWithUnread = conversationsRaw.filter(Boolean);

    const total = await Conversation.countDocuments({
      participants: userId,
      [`archived.${userId}`]: { $ne: true },
      [`deletedBy.${userId}`]: { $ne: true }
    });

    res.json({
      success: true,
      data: conversationsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

// Get single conversation
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email profilePicture')
      .populate('lastMessage.sender', 'name');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const unreadCount = await Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId }
    });

    // Fetch profiles for participants
    const profiles = await Profile.find({
      user: { $in: conversation.participants.map(p => p._id) }
    }).select('user profile_picture');

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile.profile_picture;
      return acc;
    }, {});

    const participantsWithPics = conversation.participants.map(p => ({
      ...p.toObject(),
      profile_picture: profileMap[p._id.toString()]
    }));

    // Find other participant for consistent response structure
    const otherParticipant = participantsWithPics.find(
      p => p._id.toString() !== userId.toString()
    );

    // Check for connection status
    const connection = otherParticipant ? await Connection.findOne({
      $or: [
        { requester: userId, recipient: otherParticipant._id },
        { requester: otherParticipant._id, recipient: userId }
      ]
    }) : null;

    res.json({
      conversation: {
        ...conversation.toObject(),
        participants: participantsWithPics,
        otherParticipant: otherParticipant || null,
        unreadCount: unreadCount,
        connectionStatus: connection ? connection.status : 'none',
        connectionRequester: connection ? connection.requester : null,
        connectionId: connection ? connection._id : null,
        blockedBy: connection ? connection.blockedBy : null
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
};

// Create or get conversation with user
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    if (userId === participantId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if users are connected
    // Check if users are connected or pending
    const connection = await Connection.findOne({
      $or: [
        { requester: userId, recipient: participantId, status: { $in: ['accepted', 'pending'] } },
        { requester: participantId, recipient: userId, status: { $in: ['accepted', 'pending'] } }
      ]
    });

    if (!connection) {
      return res.status(403).json({ error: 'Users must be connected to start a conversation' });
    }

    // Sort participants for consistent querying
    const participants = [userId, participantId].sort();

    // Check if conversation already exists
    let isNewConversation = false;
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 }
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants
      });
      await conversation.save();
      isNewConversation = true;
    }

    // If conversation was "deleted" by this user, un-delete it (they are sending a new message or opening it)
    if (conversation.deletedBy && conversation.deletedBy.get(userId.toString())) {
      conversation.deletedBy.set(userId.toString(), false);
      await conversation.save();
    }

    await conversation.populate('participants', 'name email profilePicture');

    // Fetch profiles for participants
    const profiles = await Profile.find({
      user: { $in: conversation.participants.map(p => p._id) }
    }).select('user profile_picture');

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user.toString()] = profile.profile_picture;
      return acc;
    }, {});

    const participantsWithPics = conversation.participants.map(p => ({
      ...p.toObject(),
      profile_picture: profileMap[p._id.toString()]
    }));

    // Compute otherParticipant
    const otherParticipant = participantsWithPics.find(
      p => p._id.toString() !== userId.toString()
    );

    res.status(isNewConversation ? 201 : 200).json({
      success: true,
      message: isNewConversation ? 'Conversation created' : 'Conversation exists',
      data: {
        ...conversation.toObject(),
        participants: participantsWithPics,
        otherParticipant,
        connectionStatus: connection ? connection.status : 'none',
        connectionRequester: connection ? connection.requester : null,
        connectionId: connection ? connection._id : null,
        blockedBy: connection ? connection.blockedBy : null
      }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

// Archive conversation
exports.archiveConversation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: 'Not authorized to archive this conversation' });
    }

    conversation.archived.set(userId, true);
    await conversation.save();

    res.json({ message: 'Conversation archived successfully' });

  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
};

// Mark conversation as read
exports.markConversationRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ error: 'Not authorized to update this conversation' });
    }

    conversation.lastReadBy.set(userId, new Date());
    await conversation.save();

    // Clear unread count in Redis
    try {
      const client = redisClient.getRedisClient();
      if (client && client.isOpen) {
        await client.hDel(`unread:${userId}`, conversationId);
      }
    } catch (error) {
      console.warn('Redis update failed:', error.message);
    }

    res.json({ message: 'Conversation marked as read' });

  } catch (error) {
    console.error('Mark conversation read error:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
};

// Delete conversation (soft delete/hide)
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log('Delete Chat Debug:', {
      userId,
      participants: conversation.participants,
      match: conversation.participants.some(p => p.toString() === userId)
    });

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Not authorized for this conversation' });
    }

    // Set deletedBy flag for this user
    if (!conversation.deletedBy) {
      conversation.deletedBy = new Map();
    }
    conversation.deletedBy.set(userId, true);
    await conversation.save();

    res.json({ message: 'Conversation deleted successfully' });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
