const fs = require('fs');
async function run() {
  fs.mkdirSync('.stitch/designs', {recursive: true});
  
  console.log('Downloading Dashboard HTML...');
  const htmlRes = await fetch('https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzM4MDNiMmIxOGM3YzQ1NDNiMzJiZDNlNjRmNDVkM2Y4EgsSBxDtoIGY1xIYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTU3MDY2MjM3NTIxMTEwOTY4Mg&filename=&opi=96797242');
  fs.writeFileSync('.stitch/designs/dashboard.html', await htmlRes.text());
  
  console.log('Downloading Dashboard PNG...');
  const imgRes = await fetch('https://lh3.googleusercontent.com/aida/ADBb0ug9uqB60BSzsKxSimJ09X66G43mHizYYEyRV6H3eEjCMdwNuSSwd3dJqVmBUuHr3nDPua07_MBmmLKs2ATILKr3IYx1pMTEnuXnj5rPHTNmaW9uhj28PYO-gSvzWr5N2GmOCRYNM3Co7P1ihDnP9K2cXJYsgD9WVlnBy5Iy1sfv5u4Cg2reQOgdk4jhP01sTNNfKx7gvm_L9-bD4S6i1nOq-r9MkcI0HC5xLU7QlckUax3dZNR8NFJ0BSU=w2560');
  fs.writeFileSync('.stitch/designs/dashboard.png', Buffer.from(await imgRes.arrayBuffer()));

  console.log('Done!');
}
run().catch(console.error);
