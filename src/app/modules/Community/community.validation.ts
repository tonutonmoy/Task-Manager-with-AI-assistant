import z from 'zod';

const createPost = z.object({
  body: z.object({
    description: z.string({
      required_error: 'Description is required!',
    }),
    mind: z.number({
      invalid_type_error: 'Mind must be a number',
    }).optional(),
    body: z.number({
      invalid_type_error: 'Body must be a number',
    }).optional(),
    soul: z.number({
      invalid_type_error: 'Soul must be a number',
    }).optional(),
    purpose: z.number({
      invalid_type_error: 'Purpose must be a number',
    }).optional(),
    spirituality: z.number({
      invalid_type_error: 'spirituality must be a number',
    }).optional(),
  }),
});

const editPost = z.object({
  body: z.object({
    description: z.string().optional(),
    mind: z.number().optional(),
    body: z.number().optional(),
    soul: z.number().optional(),
    purpose: z.number().optional(),
    spirituality: z.number().optional(),
  }),
});

export const CommunityValidations = {
  createPost,
  editPost,
};
