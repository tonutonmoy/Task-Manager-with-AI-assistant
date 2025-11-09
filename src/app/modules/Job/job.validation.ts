import { z } from 'zod';

const createJobTask = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required!' }),
    city: z.string({ required_error: 'City is required!' }),
    description: z.string({ required_error: 'Description is required!' }),
    zip_code: z.string({ required_error: 'Zip code is required!' }),
     state: z.string({ required_error: 'state  is required!' }),
    accurateLocation: z.any().optional(), // Json ফিল্ড
    isPaid: z.enum(['Yes', 'No'], { required_error: 'isPaid is required!' }),
    amount: z.number().optional(),
    startDate: z.string({ required_error: 'Start date is required!' }),
    endDate: z.string({ required_error: 'End date is required!' }),
    mobileNumber: z.string({ required_error: 'Mobile number is required!' }),
  }),
});

const updateJobTask = z.object({
  body: z.object({
    title: z.string().optional(),
    city: z.string().optional(),
    description: z.string().optional(),
    zip_code: z.string().optional(),
    accurateLocation: z.any().optional(),
    isPaid: z.enum(['Yes', 'No']).optional(),
    amount: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    mobileNumber: z.string().optional(),
    state: z.string().optional(),
   
  }),
});

export const JobTaskValidations = {
  createJobTask,
  updateJobTask,
};
