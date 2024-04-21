# EtherealTickets

## How to Start
1. Open google chrome and install metamask extension
   
2. Clone EtherealTickets:
```
git clone https://github.com/lyrador/etherealtickets.git
```

3. Install all dependencies:
```
cd hardhat-repo
npm install
```
```
cd ../react-repo
npm install
```

4. Open 3 separate terminals from the root directory /etherealtickets
   
5. In first terminal:
```
cd hardhat-repo
npx hardhat node
```
This starts a local blockchain that runs on the local machine. 
Now, open metamask on your browser to configure metamask.
Add the test network (hardhat network) following this parameters:

![Screenshot 2024-04-20 at 11 39 39 PM](https://github.com/lyrador/etherealtickets/assets/65401176/cb79037d-9a1b-4e73-928d-cee66706fe0d)

This values are the default rpc url and chain id for hardhat network.
Switch to hardhat network.
Import 3 accounts.
- Click add account -> import account -> copy and paste the private key of Account #0 seen from this first terminal running the blockchain. You can rename the metamask account to “Organiser”.
- Do the same for Account #1. You can rename the metamask account to Account #1.
- Do the same for Account #2. You can rename the metamask account to Account #2.

6. In second terminal:
```
cd hardhat-repo
npx hardhat run scripts/deploy.js --network localhost
```
This deploys executes the code in deploy.js to deploy the files

7. In third terminal:
```
cd react-repo
npm run start
```
This starts the frontend. You can now interact with the blockchain through the frontend.




 ## Executing Hardhat Test Cases
 ```
cd hardhat-repo
npm install       (if required)
npx hardhat test
```



 ## Architecture

![image](https://github.com/lyrador/etherealtickets/assets/65401176/9b04a917-acf6-4911-9abf-4680a135504b)



![7L3IkkdQNMw0S7TqkK5FXe_ABhPwnhZSFihVHYrSJwH9wDb0aZW5TCOU0jaB5VszvzSfr_8uMwbXHsakHSPryPqEs2IGtFlJ_6ziZ_slrXmqPRZYrbmhRNrjtqUY](https://github.com/lyrador/etherealtickets/assets/65401176/a65ce9b4-2025-49c5-b5a5-5590642ca35c)



![ob9Zq4YlpoMi1fAxdYjnPDGzxEhjMyc78iUpyZkthsiYd98cSqKqprmu0HYu7wVYpHarjE_INDGKDb7hvUsUyBa65lm6OCqaTqHJ8Lxp-N9NE_wQXzDmgjb0JouN](https://github.com/lyrador/etherealtickets/assets/65401176/4684dec3-e04d-4d7c-a4f2-1cb24f4a6dcf)




 ## Demo
 https://drive.google.com/file/d/1yp_O4PBRgB1Vijdp6Cx_bW9X0YEpwOFi/view?usp=drive_link

