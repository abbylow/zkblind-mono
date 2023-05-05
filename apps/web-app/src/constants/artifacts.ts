import { SnarkArtifacts } from "@semaphore-protocol/proof/src/types"
import path from "path"

const trustedSetupArtifacts: SnarkArtifacts = {
  wasmFilePath: path.join(process.cwd(), "/snark-artifacts/semaphore.wasm"),
  zkeyFilePath: path.join(process.cwd(), "/snark-artifacts/semaphore.zkey")
}

export default trustedSetupArtifacts;