const objects = [...document.getElementsByClassName('language-object')];

for (let i = 0; i < objects.length; i++) {
  const id = `markdownIt_object_${i}`;
  const text = objects[i].textContent;
  objects[i].outerHTML = `<div style="position: relative" id="${id}"></div>`
  jsonFormat(text, '#' + id);
}
