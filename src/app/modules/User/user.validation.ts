import z from 'zod';

const registerUser = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required!',
    }),
    email: z
      .string({
        required_error: 'Email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
    password: z
      .string({
        required_error: 'Password is required!',
      })
      .min(8, {
        message: 'Password must be at least 8 characters long!',
      }),
  }),
});

const parentApproval = z.object({
  body: z.object({

    parentName: z.string({
      required_error: 'Parent name is required!',
    }),
    relation: z.string({
      required_error: 'Relation is required!',
    }),
    parentNumber: z
      .string({
        required_error: 'Parent number is required!',
      })
      .regex(/^\+?[0-9]{7,15}$/, {
        message: 'Invalid phone number format!',
      }),
    parentEmail: z
      .string({
        required_error: 'Parent email is required!',
      })
      .email({
        message: 'Invalid email format!',
      }),
  }),
});



export const UserValidations = { registerUser,parentApproval };







