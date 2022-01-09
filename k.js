const arr = [
    {
      id: 19,
      cost: 400,
      name: 'Arkansas',
      height: 198,
      weight: 35 
    }, 
    {
      id: 21,
      cost: 250,
      name: 'Blofeld',
      height: 216,
      weight: 54 
    }, 
    {
      id: 38,
      cost: 450,
      name: 'Gollum',
      height: 147,
      weight: 22 
    }
  ];
  
  console.log(arr.some(item => item.name === 'Blofeld'));
  console.log(arr.some(item => item.name === 'Blofeld2'));