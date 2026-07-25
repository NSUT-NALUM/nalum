
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RecruitmentPreview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Job Postings</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          <li className="mb-2">
            <p className="font-bold">Senior Frontend Engineer</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Google</p>
          </li>
          <li className="mb-2">
            <p className="font-bold">Backend Engineer</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Facebook</p>
          </li>
        </ul>
        <Button variant="outline" size="sm" className="mt-4">View All Jobs</Button>
      </CardContent>
    </Card>
  );
};

export default RecruitmentPreview;
