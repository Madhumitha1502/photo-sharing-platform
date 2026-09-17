import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createTeamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createEventSchema = z.object({
  title: z.string().min(3, "Event title must be at least 3 characters"),
  description: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
});

export const assignMembersSchema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one team member"),
});

export const publishGallerySchema = z.object({
  pin: z
    .string()
    .min(4, "PIN must be at least 4 digits")
    .max(10, "PIN cannot exceed 10 characters")
    .regex(/^[0-9]+$/, "PIN must contain only numbers"),
});

export const verifyPinSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

export const photoMetadataItemSchema = z.object({
  filename: z.string().min(1),
  storageLocation: z.string().url("Invalid storage URL"),
  storageKey: z.string().optional(),
  fileSize: z.number().int().positive("File size must be positive"),
  mimeType: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const savePhotosSchema = z.object({
  photos: z.array(photoMetadataItemSchema).min(1, "At least one photo is required"),
});

export const updatePhotoSelectionSchema = z.object({
  photoIds: z.array(z.string()).min(1, "Select at least one photo"),
  isSelected: z.boolean(),
});
