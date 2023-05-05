// Note: Go Defender to create Autotask with GUI and use the code below as handler
const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
const ethers = require('ethers');

exports.handler = async function(event) {
  const {
    body,    // Object with JSON-parsed POST body
    headers, // Object with key-values from HTTP headers
    queryParameters, // Object with key-values from query parameters
  } = event.request;
  
  const {
    abi, address, functionName, functionParameters
  } = body;

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider);

  const contract = new ethers.Contract(address, abi, signer);
  const functionAbi = contract.interface.getFunction(functionName);
  const functionSignature = contract.interface.encodeFunctionData(functionAbi, functionParameters);
  
  const txRes = await signer.sendTransaction({
    to: address,
    data: functionSignature,
  });

  console.log(txRes);
  return txRes.hash;
}