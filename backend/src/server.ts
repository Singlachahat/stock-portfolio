import * as dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(Number(PORT),() => {
  console.log(`Server running on port ${PORT}`);
});
