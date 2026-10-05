export type Session = {
  id: string;
  title: string;
  venue: string;
  area: string;
  time: string;
  date: string;
  level: string;
  type: string;
  price: string;
  status: string;
  source: string;
  tone: string;
};

export const fallbackSessions: Session[] = [
  { id: "sample-1", title: "Improver open play", venue: "Park Sports Chiswick", area: "West London", time: "18:30", date: "Today", level: "Improver", type: "Open play", price: "£15", status: "Spaces available", source: "ClubSpark", tone: "mint" },
  { id: "sample-2", title: "Intermediate social", venue: "Pickleball Social", area: "Bermondsey", time: "19:00", date: "Today", level: "Intermediate", type: "Social", price: "£16", status: "Booking open", source: "Bookwhen", tone: "peach" },
  { id: "sample-3", title: "Beginner friendly session", venue: "Somers Town Sports Centre", area: "Central London", time: "10:00", date: "Tomorrow", level: "Beginner", type: "Social", price: "£8", status: "8 spaces left", source: "ClubSpark", tone: "lavender" },
  { id: "sample-4", title: "Advanced matchplay", venue: "Lemon Pickleball", area: "South London", time: "20:00", date: "Thursday", level: "Advanced", type: "Matchplay", price: "£14", status: "Booking open", source: "Direct", tone: "sky" },
];
