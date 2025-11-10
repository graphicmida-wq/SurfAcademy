import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// SESSION & AUTH TABLES (Required for Replit Auth)
// ============================================================================

// Session storage table (IMPORTANT: Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (Supports both Replit Auth and local email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Hashed password for local auth (nullable for Replit Auth users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userLevel: varchar("user_level").default("beginner"), // beginner, intermediate, advanced
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// COURSE & LEARNING TABLES
// ============================================================================

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: varchar("level").default("all"), // legacy field, no longer used in UI
  courseCategory: varchar("course_category"), // remata, takeoff, noseride, gratuiti, special
  thumbnailUrl: varchar("thumbnail_url"),
  trailerUrl: varchar("trailer_url"),
  isFree: boolean("is_free").default(false),
  price: integer("price").default(0), // in cents
  instructorName: varchar("instructor_name"),
  instructorAvatar: varchar("instructor_avatar"),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  defaultExpanded: boolean("default_expanded").default(true), // Whether module is expanded by default in student view
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  contentType: varchar("content_type"), // presentazione, ebook, planning, esercizio, riscaldamento, settimana-1, settimana-2, settimana-3, settimana-4
  videoUrl: varchar("video_url"), // Kept for backward compatibility
  videoUrls: text("video_urls").array(), // Multiple videos for settimane content
  pdfUrl: varchar("pdf_url"), // For E-Book and Planning PDFs
  htmlContent: text("html_content"), // Rich text content for E-Book and Planning
  duration: integer("duration"), // in minutes
  orderIndex: integer("order_index").notNull(),
  isFree: boolean("is_free").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: varchar("level").default("all"), // legacy field, no longer used in UI
  exerciseType: varchar("exercise_type").notNull(), // timer, reps, sets
  targetValue: integer("target_value"), // target minutes, reps, or sets
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// USER PROGRESS & ENROLLMENT TABLES
// ============================================================================

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  progress: integer("progress").default(0), // percentage 0-100
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

export const exerciseProgress = pgTable("exercise_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  completedValue: integer("completed_value").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeType: varchar("badge_type").notNull(), // first_lesson, course_complete, streak_7, etc
  badgeName: varchar("badge_name").notNull(),
  badgeIcon: varchar("badge_icon"),
  autoAssigned: boolean("auto_assigned").default(false), // Auto-assigned on course completion
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  certificateUrl: varchar("certificate_url"), // URL to PDF
  issuedAt: timestamp("issued_at").defaultNow(),
});

// ============================================================================
// E-COMMERCE & MEMBERSHIP TABLES
// ============================================================================

export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  stripePaymentId: varchar("stripe_payment_id").notNull().unique(),
  amount: integer("amount").notNull(), // Amount in cents
  purchasedAt: timestamp("purchased_at").defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  status: varchar("status").notNull(), // active, past_due, canceled, incomplete
  type: varchar("type").notNull(), // monthly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  code: varchar("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralEarnings = pgTable("referral_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // The referrer
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id), // The person who used the referral
  purchaseId: varchar("purchase_id").references(() => purchases.id),
  membershipId: varchar("membership_id").references(() => memberships.id),
  wavePoints: integer("wave_points").notNull(), // WavePoints earned
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// COMMUNITY TABLES
// ============================================================================

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  level: varchar("level"), // beginner, intermediate, advanced, all
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// CLINIC TABLES (Single-day surf lessons scheduled within waiting periods)
// ============================================================================

export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location").notNull(),
  startDate: timestamp("start_date").notNull(), // Waiting period start
  endDate: timestamp("end_date").notNull(), // Waiting period end
  price: integer("price").notNull(), // in cents
  totalSpots: integer("total_spots").notNull(),
  availableSpots: integer("available_spots").notNull(),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clinicRegistrations = pgTable("clinic_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  status: varchar("status").default("waitlist"), // waitlist, confirmed, cancelled
  registeredAt: timestamp("registered_at").defaultNow(),
});

// ============================================================================
// HERO SLIDER MANAGEMENT
// ============================================================================

export const heroSlides = pgTable("hero_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // image or video
  mediaUrl: varchar("media_url").notNull(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  ctaText: varchar("cta_text"),
  ctaLink: varchar("cta_link"),
  logoUrl: varchar("logo_url"), // Optional logo image
  logoSize: varchar("logo_size").default("medium"), // small, medium, large
  logoPosition: varchar("logo_position").default("before"), // before or after text
  orderIndex: integer("order_index").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// CMS - PAGE HEADERS & CUSTOM PAGES
// ============================================================================

export const pageHeaders = pgTable("page_headers", {
  page: varchar("page").primaryKey(), // courses, surf-camp, community, dashboard, or custom page slugs
  imageUrl: varchar("image_url"),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  paddingTop: varchar("padding_top").default("py-16"), // Tailwind padding class for top
  paddingBottom: varchar("padding_bottom").default("py-24"), // Tailwind padding class for bottom
  minHeight: varchar("min_height").default("min-h-96"), // Tailwind min-height class
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Global spacing configuration for entire page
export interface GlobalPageSpacing {
  blockMarginTop?: string; // Default margin between blocks (top)
  blockMarginBottom?: string; // Default margin between blocks (bottom)
  blockPaddingTop?: string; // Default padding inside blocks (top)
  blockPaddingBottom?: string; // Default padding inside blocks (bottom)
  containerPadding?: string; // Default padding for container blocks
}

export const customPages = pgTable("custom_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  headerImageUrl: varchar("header_image_url"),
  headerTitle: varchar("header_title", { length: 255 }),
  headerSubtitle: text("header_subtitle"),
  published: boolean("published").default(false),
  menuLocation: varchar("menu_location").default("none"), // 'header', 'footer', 'none'
  globalSpacing: jsonb("global_spacing").$type<GlobalPageSpacing>(),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// PAGE BLOCK CONTENT TYPES (Must be defined before pageBlocks schema)
// ============================================================================

export interface BlockTypography {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  textAlign?: string;
}

export interface BlockSpacing {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
}

export interface TextBlockContent {
  html: string;
  typography?: BlockTypography;
  spacing?: BlockSpacing;
}

export interface ImageBlockContent {
  url: string;
  alt?: string;
  caption?: string;
  link?: string;
  dimensions?: {
    width?: string;
    height?: string;
    aspectRatio?: string;
  };
  alignment?: 'left' | 'center' | 'right';
  spacing?: BlockSpacing;
}

export interface BannerBlockContent {
  variant: 'boxed' | 'fullwidth';
  backgroundImage?: string;
  backgroundColor?: string;
  content?: {
    title?: string;
    subtitle?: string;
    titleTypography?: Partial<BlockTypography>;
    subtitleTypography?: Partial<BlockTypography>;
  };
  cta?: {
    text?: string;
    link?: string;
    buttonStyle?: {
      variant?: string;
      size?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
  spacing?: BlockSpacing;
}

export interface GalleryBlockContent {
  images: Array<{
    url: string;
    alt?: string;
    caption?: string;
  }>;
  variant: 'carousel' | 'masonry' | 'grid';
  columns?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  gap?: string;
  itemsPerPage?: number;
  autoplay?: boolean;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  spacing?: BlockSpacing;
}

export interface CtaBlockContent {
  text: string;
  link: string;
  buttonStyle?: {
    variant?: string;
    size?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  alignment?: 'left' | 'center' | 'right';
  spacing?: BlockSpacing;
}

export interface VideoBlockContent {
  url: string;
  thumbnail?: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  dimensions?: {
    width?: string;
    height?: string;
    aspectRatio?: string;
  };
  spacing?: BlockSpacing;
}

export interface ContainerBlockContent {
  layout: 'columns' | 'rows';
  columns?: number;
  gap?: string;
  children: Array<BlockContent>; // Forward reference
  spacing?: BlockSpacing;
}

export type BlockContent = 
  | ({ type: 'text' } & TextBlockContent)
  | ({ type: 'image' } & ImageBlockContent)
  | ({ type: 'banner' } & BannerBlockContent)
  | ({ type: 'container' } & Omit<ContainerBlockContent, 'children'> & { children: BlockContent[] })
  | ({ type: 'gallery' } & GalleryBlockContent)
  | ({ type: 'cta' } & CtaBlockContent)
  | ({ type: 'video' } & VideoBlockContent);

// Page Blocks - Advanced Content Builder (Elementor-style)
// Supported types: text, image, cta, gallery, video, banner, container
// 
// contentJson structure by type:
// 
// text: {
//   type: 'text',
//   html: string,
//   typography?: { fontFamily?, fontSize?, fontWeight?, lineHeight?, letterSpacing?, color?, textAlign? },
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
// 
// image: {
//   type: 'image',
//   url: string,
//   alt?: string,
//   caption?: string,
//   link?: string,
//   dimensions?: { width?, height?, aspectRatio? },
//   alignment?: 'left' | 'center' | 'right',
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
// 
// cta: {
//   type: 'cta',
//   text: string,
//   link: string,
//   buttonStyle?: { variant?, size?, backgroundColor?, textColor? },
//   alignment?: 'left' | 'center' | 'right',
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
// 
// video: {
//   type: 'video',
//   url: string,
//   thumbnail?: string,
//   caption?: string,
//   autoplay?: boolean,
//   loop?: boolean,
//   controls?: boolean,
//   dimensions?: { width?, height?, aspectRatio? },
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
// 
// banner: {
//   type: 'banner',
//   variant: 'boxed' | 'fullwidth',
//   backgroundImage?: string,
//   backgroundColor?: string,
//   content?: { title?, subtitle?, titleTypography?, subtitleTypography? },
//   cta?: { text?, link?, buttonStyle? },
//   spacing?: { paddingTop?, paddingBottom?, paddingLeft?, paddingRight?, marginTop?, marginBottom? }
// }
// 
// container: {
//   type: 'container',
//   layout: 'columns' | 'rows',
//   columns?: number,
//   gap?: string,
//   children: Array<BlockContent>, // Strongly typed nested blocks
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
// 
// gallery: {
//   type: 'gallery',
//   images: Array<{ url, alt?, caption? }>,
//   variant: 'carousel' | 'masonry' | 'grid',
//   columns?: number,
//   columnsTablet?: number,
//   columnsMobile?: number,
//   gap?: string,
//   itemsPerPage?: number,
//   autoplay?: boolean,
//   loop?: boolean,
//   showArrows?: boolean,
//   showDots?: boolean,
//   spacing?: { marginTop?, marginBottom?, marginLeft?, marginRight?, paddingTop?, paddingBottom?, paddingLeft?, paddingRight? }
// }
export const pageBlocks = pgTable("page_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customPageId: varchar("custom_page_id").notNull().references(() => customPages.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // text, image, cta, gallery, video, banner, container
  orderIndex: integer("order_index").notNull(),
  contentJson: jsonb("content_json").notNull(), // Type-safe via BlockContent interface
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  exerciseProgress: many(exerciseProgress),
  badges: many(badges),
  posts: many(posts),
  comments: many(comments),
  clinicRegistrations: many(clinicRegistrations),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  enrollments: many(enrollments),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
  registrations: many(clinicRegistrations),
}));

export const clinicRegistrationsRelations = relations(clinicRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [clinicRegistrations.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [clinicRegistrations.clinicId],
    references: [clinics.id],
  }),
}));

export const customPagesRelations = relations(customPages, ({ many }) => ({
  blocks: many(pageBlocks),
}));

export const pageBlocksRelations = relations(pageBlocks, ({ one }) => ({
  customPage: one(customPages, {
    fields: [pageBlocks.customPageId],
    references: [customPages.id],
  }),
}));

// ============================================================================
// INSERT SCHEMAS FOR VALIDATION
// ============================================================================

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  createdAt: true,
});

export const insertClinicRegistrationSchema = createInsertSchema(clinicRegistrations).omit({
  id: true,
  registeredAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issuedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  purchasedAt: true,
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
});

export const insertReferralEarningSchema = createInsertSchema(referralEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageHeaderSchema = createInsertSchema(pageHeaders).omit({
  updatedAt: true,
});

export const insertCustomPageSchema = createInsertSchema(customPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPageBlockSchema = createInsertSchema(pageBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type ExerciseProgress = typeof exerciseProgress.$inferSelect;

export type Badge = typeof badges.$inferSelect;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;

export type ClinicRegistration = typeof clinicRegistrations.$inferSelect;
export type InsertClinicRegistration = z.infer<typeof insertClinicRegistrationSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type InsertReferralEarning = z.infer<typeof insertReferralEarningSchema>;

export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;

export type PageHeader = typeof pageHeaders.$inferSelect;
export type InsertPageHeader = z.infer<typeof insertPageHeaderSchema>;

export type CustomPage = typeof customPages.$inferSelect;
export type InsertCustomPage = z.infer<typeof insertCustomPageSchema>;

export type PageBlock = typeof pageBlocks.$inferSelect;
export type InsertPageBlock = z.infer<typeof insertPageBlockSchema>;

// ============================================================================
// NEWSLETTER SYSTEM TABLES
// ============================================================================

export const newsletterContacts = pgTable("newsletter_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, unsubscribed, bounced, spam_complaint
  confirmToken: varchar("confirm_token").unique(),
  unsubscribeToken: varchar("unsubscribe_token").unique(),
  tags: text("tags").array(), // Array of tag strings for segmentation
  subscribedIp: varchar("subscribed_ip"),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  preheader: varchar("preheader", { length: 255 }),
  htmlContent: text("html_content").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, sending, sent, failed
  tags: text("tags").array(), // Target contacts with these tags (empty = all confirmed)
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").default(0),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalBounced: integer("total_bounced").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterEvents = pgTable("newsletter_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => newsletterCampaigns.id, { onDelete: 'cascade' }),
  contactId: varchar("contact_id").notNull().references(() => newsletterContacts.id, { onDelete: 'cascade' }),
  eventType: varchar("event_type").notNull(), // sent, opened, clicked, bounced, spam_complaint
  metadata: jsonb("metadata"), // Additional data like clicked URL, bounce reason, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_newsletter_events_campaign").on(table.campaignId),
  index("idx_newsletter_events_contact").on(table.contactId),
  index("idx_newsletter_events_type").on(table.eventType),
]);

// Zod schemas for newsletter system
export const insertNewsletterContactSchema = createInsertSchema(newsletterContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalRecipients: true,
  totalSent: true,
  totalOpened: true,
  totalClicked: true,
  totalBounced: true,
});

export const insertNewsletterEventSchema = createInsertSchema(newsletterEvents).omit({
  id: true,
  createdAt: true,
});

// Newsletter type exports
export type NewsletterContact = typeof newsletterContacts.$inferSelect;
export type InsertNewsletterContact = z.infer<typeof insertNewsletterContactSchema>;

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;

export type NewsletterEvent = typeof newsletterEvents.$inferSelect;
export type InsertNewsletterEvent = z.infer<typeof insertNewsletterEventSchema>;
