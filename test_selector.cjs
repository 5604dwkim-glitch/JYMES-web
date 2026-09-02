const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><div id="container"><input id="lotNo_LH_FRT_A_초물" value="test" /></div>`);
const document = dom.window.document;
const container = document.getElementById("container");

try {
  console.log("value:", container.querySelector('#lotNo_LH_FRT_A_초물')?.value || '');
} catch (e) {
  console.error("Error:", e.message);
}
