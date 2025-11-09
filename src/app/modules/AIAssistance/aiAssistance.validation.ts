import { z } from "zod";

const createMyDaySchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required!" }),
    description: z.string({ required_error: "Description is required!" }),
  }),
});

const updateMyDaySchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),

});

export const MyDayValidations = {
  createMyDaySchema,
  updateMyDaySchema,
};
