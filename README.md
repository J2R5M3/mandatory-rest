# mandatory_rest

## Testing User Flow

### Local Testing

1. Install dependencies:
   `npm install`

2. Set up the local D1 database.
   Run `npm run build` once to create `.astro` artifacts, then run:
   `npx wrangler d1 migrations create mandatory_rest_db init` (if migrations folder is empty)
   Copy schema into the migration: `cat schema.sql > migrations/0000_init.sql`
   Apply the migration locally:
   `npx wrangler d1 migrations apply mandatory_rest_db --local`

3. Start the local server in one terminal:
   `npm run start`

4. Open a second terminal and run the test flow script:
   `./test-flow.sh`

5. Watch the server output for the database operations and the cron algorithm executing the Ephemeral Data flow.

### Deploying to Cloudflare

1. Create a D1 database on Cloudflare:
   `npx wrangler d1 create mandatory_rest_db`

2. Update `wrangler.jsonc` with the `database_id` outputted by the command above.

3. Apply the migrations to your remote D1 database:
   `npx wrangler d1 migrations apply mandatory_rest_db --remote`

4. Deploy the application:
   `npm run deploy`
