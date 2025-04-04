export function initDivs() {
  const genMsgDiv = document.createElement('div');
  genMsgDiv.id = 'gen_msg';
  genMsgDiv.className = 'container_gen_msg';
  genMsgDiv.innerHTML = 'unknown organization';
  document.body.appendChild(genMsgDiv);

  const csaMsgDiv = document.createElement('div');
  csaMsgDiv.id = 'csa_msg';
  csaMsgDiv.className = 'container_csa_msg';
  document.body.appendChild(csaMsgDiv);
}

export function displayMessage(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = message;
}
