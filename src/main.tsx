import { Hono } from "@hono/hono";
import { appendTrailingSlash } from "@hono/hono/trailing-slash";
import { cors } from "@hono/hono/cors";
import { serveStatic } from "@hono/hono/deno";
import { swaggerUI } from "npm:@hono/swagger-ui";
import { dbAdd, dbDeleteAll, dbList, dbListAll } from "./db.ts";

const api = new Hono();

api.use("/*", cors());

api.get("/poll/:poll", async (c) => {
  const poll = Number(c.req.param("poll"));
  const resp = await dbList(poll);
  return c.json(resp);
});
api.post("/poll/:poll", async (c) => {
  const poll = Number(c.req.param("poll"));
  const resp = await dbAdd(poll, await c.req.json());
  return c.json(resp, 201);
});
api.delete("/POLL-ALL", async (c) => {
  await dbDeleteAll();
  c.status(204);
  return c.body(null);
});

const Option = ({ option, voters, totalVoters }) => (
  <div className="option">
    <div className="option__text">{option} ({voters.length})</div>
    <progress className="option__bar" max={totalVoters} value={voters.length}>
      {voters.length}
    </progress>
    <div className="option__voters">
      {voters.map((voter) => (
        <span className="voter">{voter}</span>
      ))}
    </div>
  </div>
);

const Poll = ({ question, options }) => {
  const totalVoters = options.reduce(
    (accumulator, currentValue) => accumulator + currentValue.voters.length,
    0
  );
  return (
    <>
      <h2>{question}</h2>
      <div class="options">
        {options.map((option) => (
          <Option
            option={option.option}
            voters={option.voters}
            totalVoters={totalVoters}
          />
        ))}
      </div>
    </>
  );
};

const Page = ({ polls }) => (
  <html lang="cs">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="refresh" content="5"/>
      <title>Hlasování</title>
      <link rel="stylesheet" href="style.css" />
    </head>
    <body>
      <h1>Hlasování</h1>
      <div class="poll-links">
        {polls.map((poll) => (
          <Poll question={poll.question} options={poll.options} />
        ))}
      </div>
    </body>
  </html>
);

const app = new Hono();
app.use(appendTrailingSlash());
app.route("/api/", api);
app.get("/", async (c) => {
  const polls = await dbListAll();
  return c.html(<Page polls={polls} />);
});
app.get("/doc/", swaggerUI({ url: "/doc/hlasovani.yaml" }));
app.use("/*", serveStatic({ root: "./public" }));

export default { fetch: app.fetch };
