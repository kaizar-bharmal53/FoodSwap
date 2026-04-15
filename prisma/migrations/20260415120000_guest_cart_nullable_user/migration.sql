-- Guest carts use rows where user_id IS NULL; logged-in users still have at most one cart per user (unique on user_id).
ALTER TABLE "carts" ALTER COLUMN "user_id" DROP NOT NULL;
