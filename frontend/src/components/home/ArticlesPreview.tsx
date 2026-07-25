
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ArticlesPreview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          <li className="mb-2">
            <p className="font-bold">My Journey at Google</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">By @manikandan</p>
          </li>
          <li className="mb-2">
            <p className="font-bold">A Guide to Open Source Contribution</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">By @jane_doe</p>
          </li>
        </ul>
        <Button variant="outline" size="sm" className="mt-4">Read More Articles</Button>
      </CardContent>
    </Card>
  );
};

export default ArticlesPreview;
