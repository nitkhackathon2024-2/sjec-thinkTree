import Documents from "./Documents";
import KnowledgeGraph from "./KnowledgeGraph"
import ForceGraph from "../components/forcegraph"
import FileUploadSection from "../components/uploader"

const data = {
  nodes: [
    { id: 1, name: 'Node A', text: 'This is Node A', link: 'https://www.youtube.com' },
    { id: 2, name: 'Node B', text: 'This is Node B', link: 'https://www.google.com' },
    { id: 3, name: 'Node C', text: 'This is Node C', link: 'https://www.github.com' },
    { id: 4, name: 'Node D', text: 'This is Node D', link: 'https://www.wikipedia.org' },
    { id: 5, name: 'Node E', text: 'This is Node E', link: 'https://www.stackoverflow.com' },
    { id: 6, name: 'Node F', text: 'This is Node F', link: 'https://www.reddit.com' },
    { id: 7, name: 'Node G', text: 'This is Node G', link: 'https://www.medium.com' },
    { id: 8, name: 'Node H', text: 'This is Node H', link: 'https://www.netflix.com' },
    { id: 9, name: 'Node I', text: 'This is Node I', link: 'https://www.apple.com' },
    { id: 10, name: 'Node J', text: 'This is Node J', link: 'https://www.microsoft.com' },
    { id: 11, name: 'Node K', text: 'This is Node K', link: 'https://www.github.com' },
    { id: 12, name: 'Node L', text: 'This is Node L', link: 'https://www.google.com' },
    { id: 13, name: 'Node M', text: 'This is Node M', link: 'https://www.youtube.com' }
  ],
  links: [
    { source: 1, target: 2 },
    { source: 1, target: 3 },
    { source: 2, target: 4 },
    { source: 2, target: 5 },
    { source: 3, target: 6 },
    { source: 3, target: 7 },
    { source: 4, target: 8 },
    { source: 5, target: 9 },
    { source: 6, target: 10 },
    { source: 7, target: 11 },
    { source: 8, target: 12 },
    { source: 9, target: 13 }
  ]
};
export default function Home() {

  return (
    <>
    <div>
    <FileUploadSection/>
      <ForceGraph data = {data}/>

      </div>
      {/* <div className="w-1/2 flex flex-col border-r border-gray-700 py-4 space-y-4">
        <Documents />
      </div>
      <KnowledgeGraph /> */}
      
    </>
  );
}
