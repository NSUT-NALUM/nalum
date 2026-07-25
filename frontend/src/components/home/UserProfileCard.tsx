import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import VerifiedBadge from "../ui/VerifiedBadge";

const UserProfileCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-bold">User</p>
            <VerifiedBadge />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Software Engineer
          </p>
          <Button variant="outline" size="sm" className="mt-2">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
