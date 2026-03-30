// TIL List registration functionality
const tilForm = document.querySelector("#til-form");
const tilList = document.querySelector("#til-list");

if (tilForm && tilList) {
  tilForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // 1. Get input values
    const dateInput = document.querySelector("#til-date");
    const titleInput = document.querySelector("#til-title");
    const contentInput = document.querySelector("#til-content");

    const date = dateInput.value;
    const title = titleInput.value;
    const content = contentInput.value;

    // 2. Create new TIL item structure
    const article = document.createElement("article");
    article.classList.add("til-item");

    const time = document.createElement("time");
    time.textContent = date;

    const h3 = document.createElement("h3");
    h3.textContent = title;

    const p = document.createElement("p");
    p.textContent = content;

    // 3. Assemble and add to list
    article.appendChild(time);
    article.appendChild(h3);
    article.appendChild(p);

    // Add to the top of the list
    tilList.prepend(article);

    // 4. Reset form
    tilForm.reset();
    
    // Optional: Scroll to the new item
    article.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
