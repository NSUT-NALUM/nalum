
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DiscussionForumPreview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Discussions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          <li className="mb-2">
            <p className="font-bold">What are the best resources for learning TypeScript?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Started by @jane_doe</p>
          </li>
          <li className="mb-2">
            <p className="font-bold">How to prepare for a system design interview?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Started by @john_doe</p>
          </li>
        </ul>
        <Button variant="outline" size="sm" className="mt-4">View All Discussions</Button>
      </CardContent>
    </Card>
  );
};

export default DiscussionForumPreview;
