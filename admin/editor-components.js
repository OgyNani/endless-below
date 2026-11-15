/* Reusable Devlog body blocks for the Decap markdown editor. */
(function () {
  "use strict";
  if (!window.CMS) return;

  function fieldLine(key, value) {
    return key + ": " + String(value == null ? "" : value).replace(/\r?\n/g, " ") + "\n";
  }

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  CMS.registerEditorComponent({
    id: "animation-pair",
    label: "Animation Pair",
    fields: [
      { name: "title", label: "Section title", widget: "string", required: false, hint: "e.g. Side movement" },
      { name: "left", label: "Left image", widget: "image" },
      { name: "left_label", label: "Left label", widget: "string", default: "Female" },
      { name: "left_alt", label: "Left alt text", widget: "string", required: false },
      { name: "right", label: "Right image", widget: "image" },
      { name: "right_label", label: "Right label", widget: "string", default: "Male" },
      { name: "right_alt", label: "Right alt text", widget: "string", required: false }
    ],
    pattern: /^:::animation-pair[ \t]*\n([\s\S]*?)\n:::[ \t]*$/m,
    fromBlock: function (match) {
      var data = {
        title: "",
        left: "",
        left_label: "Female",
        left_alt: "",
        right: "",
        right_label: "Male",
        right_alt: ""
      };
      String(match[1] || "").split("\n").forEach(function (line) {
        var index = line.indexOf(":");
        if (index < 0) return;
        var key = line.slice(0, index).trim();
        var value = line.slice(index + 1).trim();
        if (Object.prototype.hasOwnProperty.call(data, key)) data[key] = value;
      });
      return data;
    },
    toBlock: function (data) {
      data = data || {};
      return (
        ":::animation-pair\n" +
        fieldLine("title", data.title) +
        fieldLine("left", data.left) +
        fieldLine("left_label", data.left_label || "Female") +
        fieldLine("left_alt", data.left_alt) +
        fieldLine("right", data.right) +
        fieldLine("right_label", data.right_label || "Male") +
        fieldLine("right_alt", data.right_alt) +
        ":::"
      );
    },
    toPreview: function (data) {
      data = data || {};
      function cell(src, alt, label) {
        var image = src
          ? '<img src="' +
            escapeAttr(src) +
            '" alt="' +
            escapeAttr(alt || label) +
            '" style="image-rendering:pixelated;width:128px;height:128px;object-fit:contain">'
          : "";
        return (
          '<div style="text-align:center">' +
          image +
          '<div style="margin-top:8px;letter-spacing:.16em;text-transform:uppercase">' +
          escapeAttr(label || "") +
          "</div></div>"
        );
      }
      var title = data.title
        ? '<p style="text-align:center;letter-spacing:.16em;text-transform:uppercase">' +
          escapeAttr(data.title) +
          "</p>"
        : "";
      return (
        '<div>' +
        title +
        '<div style="display:flex;gap:32px;justify-content:center;align-items:flex-end;flex-wrap:wrap">' +
        cell(data.left, data.left_alt, data.left_label) +
        cell(data.right, data.right_alt, data.right_label) +
        "</div></div>"
      );
    }
  });
})();
