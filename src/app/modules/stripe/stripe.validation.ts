// // import z from "zod";

// // // Interval enum type
// // const intervalEnum = z.enum(["month", "year", "lifetime"]);

// //  const subscriptionPlanValidation = z.object({
// //   body: z.object({
// //     name: z.string({
// //       required_error: "Plan name is required!",
// //     }),
// //     amount: z
// //       .number({
// //         required_error: "Amount is required!",
// //       })
// //       .min(1, "Amount must be greater than 0"),
// //     currency: z
// //       .string()
// //       .optional()
// //       .default("usd"),
// //     interval: intervalEnum.optional().default("month"),
// //     paymentType: z
// //       .string()
// //       .optional()
// //       .default("Stripe"),
// //   }),
// // });


// // export const stripeValidation = { subscriptionPlanValidation};









// import { IntervalType, SubscriptionType } from "@prisma/client";
// import { z } from "zod";

// const featureSchema = z.array(
//   z.object({
//     key: z.string().min(1, "Feature label is required"),
//     value: z.union([z.string(), z.number()]),
//   })
// );

// const subscriptionSchema = z.object({
//   title: z.nativeEnum(SubscriptionType),
//   interval: z.nativeEnum(IntervalType),
//   interval_count:z.number(),
//   price:z.number(),
//   features: featureSchema,
// });

// export const subscriptionValidation = {
//   subscriptionSchema,
// };
