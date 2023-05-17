import './App.css';

import { useEffect, useState } from 'react';

import axios from 'axios';
import logo from './logo.svg';

async function getGraphs(entity, repo, dir) {
  // get files
  const url = `https://api.github.com/repos/${entity}/${repo}/git/trees/main`;
  const dirTreeResponse = await axios.get(url);
  const dirSHA = dir ? dirTreeResponse.data.tree.find(_ => _.type ==='tree' && _.name === dir) : dirTreeResponse.data.sha;
  const dirUrl = `https://api.github.com/repos/${entity}/${repo}/git/trees/${dirSHA}`;
  const filesResponse = await axios.get(dirUrl);
  const allImagesNames = filesResponse.data.tree.filter(_ => _.path.endsWith('.jpg')).map(_ => _.path);
  console.log(allImagesNames);
  return allImagesNames;
}

function button(){


  return <div>
    <div className='button-left'></div>
  </div>
}

function App() {
  const [data, setData] = useState([]);
  // get all images
  ///get parameters for call
  const urlParams = new URLSearchParams(window.location.search);
  const entity = urlParams.get('entity');
  const repo = urlParams.get('repo');
  const dir = urlParams.get('dir');


  //// recursive call to get all images
  useEffect(() => {
    async function getData() {
      const data = await getGraphs(entity, repo, dir);
      setData(data);
    }
    getData();
  }, []);

  //buttons

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
