// verify-art.js
const artHash = args[0];

const response = await Functions.makeHttpRequest({
  url: `https://your-api.com/verify?hash=${artHash}`,
  method: "GET"
});

if (response.error) {
  throw Error("API request failed");
}

return Functions.encodeString(response.data.authentic ? "true" : "false");
