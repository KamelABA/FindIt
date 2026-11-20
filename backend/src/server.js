import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`FindIt API running on http://localhost:${config.port}/api`);
  if (config.tempEmailLogin) {
    console.warn("TEMP_EMAIL_LOGIN is on: admin access by email only. Turn it off in production.");
  }
});
