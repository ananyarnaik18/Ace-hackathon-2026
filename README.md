# TuitionDesk

A simple back office for a solo home tutor. It keeps students, invoices, payments and recurring bills in one place, and shows how much cash she will have over the next 30, 60 or 90 days.

## The problem and the user

Meera is a solo home tutor. She teaches 20 students in four batches: Class 8 Maths, Class 9 Maths & Science, Class 10 Maths and Class 10 Science. Parents pay monthly fees by UPI or cash. Today she tracks all of this in a notebook and WhatsApp, so she cannot quickly see who owes her money, how long they have owed it, or whether she will have enough cash for rent on 1 December.

Her bad day looks like this: several parents pay late in the same week, the rent falls due, and she finds out only when the account is short. TuitionDesk shows that gap before it happens.

## Features

- **Invoice to payment.** Create a draft invoice for one student, or generate the month's invoices for every student who does not have one yet. Mark a draft as sent. Record a full or partial payment by UPI or cash; an invoice shows as paid when its balance reaches zero. Draft reminders include the parent's name, the student, the amount due and the days overdue, and open in WhatsApp with the message filled in. Nothing is sent automatically.
- **Who owes me (dashboard).** Summary cards for total outstanding, overdue amount, collected this month and students who owe. A table of unpaid invoices, most overdue first, with balance, due date and days overdue. Drafts are not counted as owed.
- **Alerts with next actions.** Chase an overdue parent (most late first), invoices due in the next 3 days, drafts not yet sent, and a top-priority cash alert when the 30-day forecast goes below zero. Five alerts show at a time, with "Show all" for the rest.
- **30, 60 or 90-day cash forecast.** Set the opening balance and when overdue invoices are expected to be paid. Shows money in, money out and the running balance day by day, the lowest balance, the first day cash goes negative, and a chart with the negative area in red.
- **What-if.** Four scenarios run on a copy of the data, so saved invoices and payments are never changed:
  - every unpaid invoice is paid N days late (default 15), with the preset "Bad day: everyone pays 15 days late";
  - one student's parent pays N days late, with the preset "Biggest late payer pays 15 days late";
  - a student is removed for the month;
  - a bill increases by a set amount.
  The result shows the baseline and the what-if as two lines on the chart, compares lowest balance, first negative date and money in, and gives one plain sentence describing the outcome.
- **Students and Bills.** A searchable student list filterable by batch, and add, edit and delete for recurring bills such as rent, internet and study materials.

## Assumptions and limitations

- **Sample data.** The 20 students, parents, phone numbers and invoices are fictional and are generated the first time the app opens. Rent is ₹8,000. Internet (₹999) and study materials (₹1,500) are placeholder amounts.
- **Everyone pays in full.** The forecast assumes every unpaid invoice is paid in full: sent invoices on their due date, and overdue ones on a collection date set in days from today (default 7). Partial or missed payments are only tested through the what-if scenarios.
- **No backend, no login.** Data is stored in the browser's localStorage. Clearing site data starts the app again with the sample data. Another browser or device has its own separate copy. There is no sync and no backup yet.
- **English reminders only.** Reminders are written in English. The tutor sends them herself from WhatsApp.
- **Whole rupees.** Amounts are whole rupees. Bills fall due on days 1 to 28 of the month.
- **Date-dependent results.** Overdue, due-soon and forecast results depend on today's date on the device.

## Business viability

- **Price:** ₹299 per month per tutor, free for up to 5 students.
- **Payback:** one recovered fee of ₹1,500 pays for five months of subscription (5 × ₹299 = ₹1,495).
- **Channel:** WhatsApp tutor groups, where tutors already share fee and scheduling tips.
- **Running cost:** close to zero. The app is static files with no server or database to run.

These are planned figures, not measured results.

## Run locally

1. `npm install`
2. `npm run dev`, then open the local address it prints.
3. `npm run build` creates a production build in `dist/`.

Requires Node.js 18 or newer.

## How it was built

TuitionDesk was built with Codebenders Nexen in short loops. Each step started with a written plan (stack, file structure, data model) that was approved before any file changed. Each change was then made in a small, separate edit and checked before the next one began: the production build, Node checks on the business logic in `src/data/`, and a search for leftover markup. The screens were not clicked through in an automated browser test.

## Recent changes

- **Students page:** add, edit and delete students with validation (name, parent name, 10-digit parent phone, batch, monthly fee, due day 1 to 28). Adding a student can create this month's invoice as a draft. Deleting a student also removes their invoices and payments, after a confirmation.
- **Reset demo data:** a button on the Students page reloads the sample data after a confirmation.
- **Hinglish reminders:** the reminder panel has an English / Hinglish toggle. The English text is unchanged.
- **Why TuitionDesk pays for itself:** a dashboard card shows the amount collected this month against the ₹299/month plan.
- **Cash outlook:** a dashboard card shows the lowest forecast balance in the next 30 days, in red if negative, with a button that opens the Forecast page with the "Bad day" scenario (everyone pays 15 days late).
- **Next-action hints:** the "Who owes what" table suggests a next step by days overdue (1 to 7: send a gentle reminder; 8 to 20: follow up by call or WhatsApp today; over 20: call the parent and agree a payment date).
- **Seeded recurring bills:** Rent ₹8,000 (day 1), Internet ₹700 (day 5), Electricity ₹1,200 (day 10).

## Testing

Run `npm test`. It uses Node's built-in test runner (`node --test`) over the invoice, forecast, what-if and dashboard calculations in `src/tests/`.

