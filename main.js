let paragraph = document.getElementById('paragraph');
const Http = new XMLHttpRequest();
const url='https://icanhazdadjoke.com/';

Http.addEventListener("readystatechange", function () {
	if (this.readyState === this.DONE) {
        const res = JSON.parse(this.responseText);
        paragraph.textContent = res.joke;
	}
});


Http.open("GET", url);
Http.setRequestHeader('Accept', 'application/json');
Http.send();