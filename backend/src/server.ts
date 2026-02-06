import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

app.listen(Number(PORT), HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
