import type { MealChoiceId } from "@/services/rsvpApi";


export const MEAL_TAG_TONE: Record<MealChoiceId, "neutral" | "green" | "red" | "blue"> = {
  standard: "neutral",
  vegetarian: "green",
  vegan: "green",
  gluten_free: "red",
  baby: "blue",
};
