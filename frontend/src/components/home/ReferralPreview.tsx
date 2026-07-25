
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ReferralPreview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300">You have no active referrals.</p>
        <Button variant="outline" size="sm" className="mt-4">Request a Referral</Button>
      </CardContent>
    </Card>
  );
};

export default ReferralPreview;
