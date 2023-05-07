import { task, types } from "hardhat/config"

task("deploy", "Deploy a Post contract")
    .addOptionalParam("semaphore", "Semaphore contract address", undefined, types.string)
    .addOptionalParam("group", "Group id", "2", types.string)
    .addOptionalParam("minCommitmentAge", "Min Commitment Age", 60, types.int)
    .addOptionalParam("maxCommitmentAge", "Max Commitment Age", 604800, types.int)
    .addOptionalParam("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs, semaphore: semaphoreAddress, group: groupId, minCommitmentAge, maxCommitmentAge }, { ethers, run }) => {
        if (!semaphoreAddress) {
            const { semaphore } = await run("deploy:semaphore", {
                logs
            })

            semaphoreAddress = semaphore.address
        }

        if (!groupId) {
            groupId = process.env.GROUP_ID
        }

        const PostFactory = await ethers.getContractFactory("Post")

        const postContract = await PostFactory.deploy(semaphoreAddress, groupId, minCommitmentAge, maxCommitmentAge)

        await postContract.deployed()

        if (logs) {
            console.info(`Post contract has been deployed to: ${postContract.address}`)
        }

        return postContract
    })
