export function saveFile({ blob, fileName }) {
    const a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);

    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();

    window.URL.revokeObjectURL(url);
}