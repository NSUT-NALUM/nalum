
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CalendarPreview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ul>
          <li className="mb-2">
            <p className="font-bold">Alumni Meetup</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">October 25, 2025</p>
          </li>
          <li className="mb-2">
            <p className="font-bold">Webinar: The Future of AI</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">November 15, 2025</p>
          </li>
        </ul>
        <Button variant="outline" size="sm" className="mt-4">View Calendar</Button>
      </CardContent>
    </Card>
  );
};

export default CalendarPreview;
