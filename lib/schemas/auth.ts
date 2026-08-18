import {z} from "zod";

export const signUpSchema = z.object({
    firstName: z.string().trim().min(1,"First name is required"),
    lastName: z.string().trim().min(1,"Last name is required"),
    email: z.email("Enter a valid email.").trim().min(1,"Email is required.").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[0-9]/, "Password must contain a number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character."),

});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
    email: z.email("Enter a valid email.").trim().min(1,"Email is required.").toLowerCase(),
    password: z.string().min(8,"Password must be at least 8 characters."),
});
export type SignInFormValues = z.infer<typeof signInSchema>;

export const codeSchema = z.object({
    code: z.string().min(1,"Enter the verification code."),
});
export type CodeFormValues = z.infer<typeof codeSchema>