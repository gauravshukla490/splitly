import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  timestamp,
  numeric,
  primaryKey,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users" , 
  {
    id : uuid("id")
         .defaultRandom()
         .primaryKey() ,

    name : varchar("name" ,{length : 255})
           .notNull() ,

    email : varchar("email", {length : 255})
            .unique() ,

    phone : varchar("phone" , {length : 15})
            .unique() ,

    profilePhotoUrl : text("profile_photo_url") ,

    passwordHash : varchar("password_hash" , {length : 255})
                    .notNull() ,
    
    baseCurrency : varchar("base_currency" , {length : 20})
                    .default("INR") ,
    
    createdAt: timestamp("created_at")
               .defaultNow()
               .notNull(),

    updatedAt: timestamp("updated_at")
               .defaultNow()
               .notNull(),
            
  }
);

export const groups = pgTable("groups" ,
   {
     id : uuid("id")
          .defaultRandom()
          .primaryKey() ,

      name : varchar("name" , {length : 50})
             .notNull() ,

      groupPhoto : text("group_photo") ,

      createdBy : uuid("created_by")
                  .references(()=>users.id)
                   .notNull(),

      isOneOnOne : boolean("is_one_on_one")
                   .default(true)
                   .notNull() ,

      createdAt : timestamp("created_at")
                  .defaultNow()
                  .notNull(),
   });

   export const groupMember = pgTable("group_member" , 
     {
       id : uuid("id")
            .defaultRandom()
            .primaryKey() ,

       groupId : uuid("group_id")
                 .references(()=> groups.id)
                 .notNull() ,

       userId : uuid("user_id")
                .references(() => users.id)
                .notNull() ,

      isActive : boolean("is_active")
                 .default(true)
                 .notNull(),

     }
   );

export const expenses = pgTable("expenses", {
  id: uuid("id")
      .defaultRandom()
      .primaryKey(),

  groupId: uuid("group_id")
      .references(() => groups.id)
      .notNull(),

  paidBy: uuid("paid_by")
      .references(() => users.id)
      .notNull(),

  title: varchar("title", { length: 255 })
      .notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 })
      .notNull(),

  currency: varchar("currency", { length: 10 })
      .notNull(),

  createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
});

export const expenseSplits = pgTable("expense_splits", {
  id: uuid("id")
      .defaultRandom()
      .primaryKey(),

  expenseId: uuid("expense_id")
      .references(() => expenses.id)
      .notNull(),

  userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),

  amountOwed: numeric("amount_owed", { precision: 12, scale: 2 })
      .notNull(),

  convertedAmount: numeric("converted_amount", { precision: 12, scale: 2 })
      .notNull(),

  exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 })
      .notNull(),
});

export const settlements = pgTable("settlements", {
  id: uuid("id")
      .defaultRandom()
      .primaryKey(),

  fromUser: uuid("from_user")
      .references(() => users.id)
      .notNull(),

  toUser: uuid("to_user")
      .references(() => users.id)
      .notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 })
      .notNull(),

  currency: varchar("currency", { length: 10 })
      .notNull(),

  note: text("note"),

  fromConfirmed: boolean("from_confirmed")
      .default(false)
      .notNull(),

  toConfirmed: boolean("to_confirmed")
      .default(false)
      .notNull(),

  createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
});