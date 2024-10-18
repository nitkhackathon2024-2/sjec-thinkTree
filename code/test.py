from semantic_text_splitter import TextSplitter
from pypdf import PdfReader

max_characters = 1000
text = ""
splitter = TextSplitter(max_characters, trim=False)
reader = PdfReader("testt.pdf")
for page in reader.pages:
    text+= page.extract_text()

# chunking
chunks = splitter.chunks(text)

for chunk in chunks:
    print(chunk,"//////////////////")

