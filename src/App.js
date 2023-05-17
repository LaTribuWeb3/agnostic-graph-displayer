import './App.css';

import { useEffect, useState } from 'react';

import axios from 'axios';
import logo from './logo.svg';

async function getParameters(entity, repo, dir) {
  // get files
  const url = `https://api.github.com/repos/${entity}/${repo}/git/trees/main`;
  const dirTreeResponse = await axios.get(url);
  const dirSHA = dir ? dirTreeResponse.data.tree.find(_ => _.type ==='tree' && _.name === dir) : dirTreeResponse.data.sha;
  const dirUrl = `https://api.github.com/repos/${entity}/${repo}/git/trees/${dirSHA}`;
  const filesResponse = await axios.get(dirUrl);
  const allImagesNames = filesResponse.data.tree.filter(_ => _.path.endsWith('.jpg')).map(_ => _.path);
  console.log(allImagesNames[0]);


  // extract parameter names from the first image 
  // bib-0.1+brh-0.001+vfs-125+clf-0.1.jpg
  const parametersString = allImagesNames[0].replace('.jpg', '');
  // bib-0.1+brh-0.001+vfs-125+clf-0.1
  const parameters = parametersString.split('+')
  // bib-0.1 brh-0.001 vfs-125 clf-0.1
  const extractedParameters = {};
  for(const prm of parameters) {
    const paramName = prm.split('-')[0];
    const paramNameBeautified = paramName.replace(/([A-Z])/g, ' $1').trim();

    extractedParameters[paramName] = {
      nameBeautified: paramNameBeautified
    };
  }

  const paramSets = {};
  for(const imageFileName of allImagesNames) {
    // bib-0.1+brh-0.001+vfs-125+clf-0.1.jpg
    const imageParams = imageFileName.replace('.jpg', '').split('+');
    
    for(const prm of imageParams) {
      const paramName = prm.split('-')[0];
      const paramValue = Number(prm.split('-')[1]);

      if(!paramSets[paramName]) {
        paramSets[paramName] = new Set();
      }
      paramSets[paramName].add(paramValue)
    }
  }

  for(const paramName of Object.keys(extractedParameters)) {
    extractedParameters[paramName].range = Array.from(paramSets[paramName]).sort((a,b) => a - b)
  }

  console.log({extractedParameters})
  return extractedParameters;
}

function button(){


  return <div>
    <div className='button-left'></div>
  </div>
}

function getImageUrlFromData(entity, repo, dir, data) {
  let imgName = '';
  for(const [paramName, paramValue] of Object.entries(data)) {
    imgName += imgName ? `+${paramName}-${paramValue}` : `${paramName}-${paramValue}`;
  }

  imgName += '.jpg'
  return `https://raw.githubusercontent.com/${entity}/${repo}/main/${imgName}`;
}

function App() {
  const [parameters, setParameters] = useState([]);
  const [currentData, setCurrentData] = useState({});
  // get all images
  ///get parameters for call
  const urlParams = new URLSearchParams(window.location.search);
  const entity = urlParams.get('entity');
  const repo = urlParams.get('repo');
  const dir = urlParams.get('dir') == null ? '' : urlParams.get('dir');
  


  //// recursive call to get all images
  useEffect(() => {
    async function getData() {
      const params = await getParameters(entity, repo, dir);
      setParameters(params);
      const baseCurrentData = {}
      for(const [paramName, paramValue] of Object.entries(params)) {
        baseCurrentData[paramName] = paramValue.range[0];
      }
      setCurrentData(baseCurrentData);
    }
    getData();
  }, []);

  //buttons

  return (
    <div className="App">
      <header className="App-header">
      <img src={getImageUrlFromData(entity, repo, dir, currentData)}></img>
      {Object.keys(currentData).map(_ =>
          <p key={_}>{parameters[_].nameBeautified} {currentData[_]}</p>
      )}
      </header>
    </div>
  );
}

export default App;
