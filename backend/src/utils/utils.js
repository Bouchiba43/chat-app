export function logRequestBody(req) {
  console.log("====== Request Body ======");
  if (Object.keys(req.body).length === 0) {
    console.log("No fields in request body.");
  } else {
    Object.entries(req.body).forEach(([key, value], index) => {
      console.log(`${index + 1}. ${key}: ${JSON.stringify(value, null, 2)}`);
    });
  }
  console.log("==========================");
}
