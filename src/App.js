import './App.css';

import { useEffect, useState } from 'react';

import axios from 'axios';

async function getParameters(entity, repo, dir) {

  // get files
  const url = `https://api.github.com/repos/${entity}/${repo}/git/trees/main`;
  const dirTreeResponse = await axios.get(url);
  console.log(entity, repo, dir);
  const dirSHA = dir ? dirTreeResponse.data.tree.find(_ => _.type === 'tree' && _.path === dir).sha : dirTreeResponse.data.sha;
  const dirUrl = `https://api.github.com/repos/${entity}/${repo}/git/trees/${dirSHA}`;
  const filesResponse = await axios.get(dirUrl);
  const allImagesNames = filesResponse.data.tree.filter(_ => _.path.endsWith('.jpg')).map(_ => _.path);


  // extract parameter names from the first image 
  // bib-0.1+brh-0.001+vfs-125+clf-0.1.jpg
  const parametersString = allImagesNames[0].replace('.jpg', '');
  // bib-0.1+brh-0.001+vfs-125+clf-0.1
  const parameters = parametersString.split('+')
  // bib-0.1 brh-0.001 vfs-125 clf-0.1
  const extractedParameters = {};
  for (const prm of parameters) {
    const paramName = prm.split('-')[0];
    const paramNameBeautified = paramName.replace(/([A-Z])/g, ' $1').trim();


    extractedParameters[paramName] = {
      nameBeautified: paramNameBeautified
    };
  }

  const paramSets = {};
  for (const imageFileName of allImagesNames) {
    // bib-0.1+brh-0.001+vfs-125+clf-0.1.jpg
    const imageParams = imageFileName.replace('.jpg', '').split('+');

    for (const prm of imageParams) {
      const paramName = prm.split('-')[0];
      const paramValue = prm.split('-')[1];

      if (!paramSets[paramName]) {
        paramSets[paramName] = new Set();
      }
      paramSets[paramName].add(paramValue)
    }
  }

  for (const paramName of Object.keys(extractedParameters)) {
    extractedParameters[paramName].range = Array.from(paramSets[paramName]).sort((a, b) => Number(a) - Number(b))
  }

  console.log({ extractedParameters })
  return extractedParameters;
}

function getImageUrlFromData(entity, repo, dir, data) {
  let imgName = '';
  for (const [paramName, paramValue] of Object.entries(data)) {
    imgName += imgName ? `+${paramName}-${paramValue}` : `${paramName}-${paramValue}`;
  }

  imgName += '.jpg'
  if(dir) {
    return `https://raw.githubusercontent.com/${entity}/${repo}/main/${dir}/${imgName}`;
  } else {
    return `https://raw.githubusercontent.com/${entity}/${repo}/main/${imgName}`;
  }
}

function Row(props) {
  const param = props.param;
  const value = props.currentData[param];
  const upReached = value === props.parameters[param].range.at(-1) ? true : false;
  const downReached = value === props.parameters[param].range[0] ? true : false;

  return <div className='Row-container'>
    <div className='Row'>
      <p className='Row-text' key={param}>{props.parameters[param].nameBeautified}</p>
      <button className='Row-button' onClick={() => props.handleChange(param, value, 'down')} disabled={downReached}>prev</button>
      <p className='Row-text'>{value}</p>
      <button className='Row-button' onClick={() => props.handleChange(param, value, 'up')} disabled={upReached}>next</button>
    </div>
  </div>
}

function App() {
  const [parameters, setParameters] = useState([]);
  const [currentData, setCurrentData] = useState({});
  const [loading, setLoading] = useState(true);
  // get all images
  ///get parameters for call
  const urlParams = new URLSearchParams(window.location.search);
  const entity = urlParams.get('entity');
  const repo = urlParams.get('repo');
  const dir = urlParams.get('dir') == null ? '' : urlParams.get('dir');

  //// recursive call to get all images
  useEffect(() => {
    async function getData() {
      
      if(entity == null || repo == null) {
        console.log('entity or repo is null');
        return;
      }
      const params = await getParameters(entity, repo, dir);
      setParameters(params);
      const baseCurrentData = {}
      for (const [paramName, paramValue] of Object.entries(params)) {
        baseCurrentData[paramName] = paramValue.range[0];
      }
      setCurrentData(baseCurrentData);
      setLoading(false);
    }
    getData();
  }, [dir, entity, repo]);

  //buttons
  function changeState(param, value, direction) {
    const stateReplacement = { ...currentData };
    const index = parameters[param].range.indexOf(value);
    if (direction === 'up') {
      stateReplacement[param] = parameters[param].range[index + 1];
      if(stateReplacement[param]){
        setCurrentData(stateReplacement);
      };
    }
    else {
      stateReplacement[param] = parameters[param].range[index - 1];
      if(stateReplacement[param]){
        setCurrentData(stateReplacement);
      };
    }
  }

  return (
    <div className="App">
      {(entity == null || repo == null) ? <div className='Card'> Please enter entity and repo </div> : loading ? <div className='Card'> Loading </div> : 
      <div className='Card'>
        <img className="App-image" src={getImageUrlFromData(entity, repo, dir, currentData)} alt='graph'></img>
        <div className='App-controls'>{Object.keys(currentData).map(_ =>
          <Row param={_} parameters={parameters} currentData={currentData} handleChange={changeState} />
        )}</div>
      </div>
      }
    </div>

  );
}

export default App;
