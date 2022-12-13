
//sem os parenteses para ser chamada pelo app.js
module.exports.getDateModel = function () {
  const today = new Date();
  const currentDay = today.getDay();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }
  return today.toLocaleDateString("en-US", options);
}
