export type SelectOption = {
  value: string;
  label: string;
};

export const OCCUPATION_OPTIONS: SelectOption[] = [
  "Accountant",
  "Architect",
  "Artist",
  "Chef",
  "Consultant",
  "Designer",
  "Developer",
  "Doctor",
  "Engineer",
  "Entrepreneur",
  "Finance",
  "Lawyer",
  "Manager",
  "Marketing",
  "Nurse",
  "Photographer",
  "Sales",
  "Scientist",
  "Student",
  "Teacher",
  "Writer",
].map((value) => ({ value, label: value }));

export const INTEREST_OPTIONS: SelectOption[] = [
  "Art",
  "Brunch",
  "Cocktails",
  "Cooking",
  "Dancing",
  "Fashion",
  "Fitness",
  "Food & Dining",
  "Gaming",
  "Hiking",
  "Live Events",
  "Music",
  "Nightlife",
  "Photography",
  "Reading",
  "Sport",
  "Travel",
  "Wine",
  "Yoga",
].map((value) => ({ value, label: value }));
