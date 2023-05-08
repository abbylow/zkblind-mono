import React, {
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect
} from "react";
import getNextConfig from "next/config";
import { Identity } from "@semaphore-protocol/identity";

import SemaphoreContext from "@/context/SemaphoreContext";
import { notifyError } from "@/utils/notification";
import Post from "../../contract-artifacts/Post.json"

const { publicRuntimeConfig: env } = getNextConfig();

interface IIdentityContext {
  identity: Identity | null,
  onIdentityCreated: (i: Identity) => void,
  inGlobalGroup: boolean
}

const initialIdentityContext: IIdentityContext = {
  identity: null,
  onIdentityCreated: () => { },
  inGlobalGroup: false
}

const IdentityContext = React.createContext<IIdentityContext>(initialIdentityContext);

export function useIdentityContext() {
  return useContext(IdentityContext);
}

const identityKey = "identity";

// TODO: add the group (or just id) the user has joined
// TODO: change this to adapt different groups
export const IdentityProvider = ({ children }: { children: ReactNode }) => {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [inGlobalGroup, setInGlobalGroup] = useState<boolean>(false);

  const { _users, addUser } = useContext(SemaphoreContext);

  // restore identity if local storage has it
  useEffect(() => {
    const identityString = localStorage.getItem(identityKey);
    if (identityString) {
      const restoredIdentity = new Identity(identityString);
      setIdentity(restoredIdentity);

      // when we found identity from local storage, it is fine to check this at client side 
      // even this inGroup value is manipulated, user can't join group here
      const inGroup = _users.includes(restoredIdentity.commitment.toString());
      setInGlobalGroup(inGroup);
    }
  }, [_users]);

  const joinGlobalGroup = async (commitmentString: string) => {
    try {
      let response: any
      if (env.OPENZEPPELIN_AUTOTASK_WEBHOOK) {
        response = await fetch(env.OPENZEPPELIN_AUTOTASK_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abi: Post.abi,
            address: env.POST_CONTRACT_ADDRESS,
            functionName: "joinGroup",
            functionParameters: [commitmentString]
          })
        })
        const resJson = await response.json();
        if (resJson.status === "error") throw Error('Autotask failed');
      } else {
        response = await fetch("api/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identityCommitment: commitmentString
          })
        })
      }

      if (response.status === 200) {
        addUser(commitmentString);
        setInGlobalGroup(true);
      } else {
        notifyError({ message: 'Fail to join global group' });
      }
    } catch (error) {
      console.error(error)
      notifyError({ message: 'Fail to join global group' });
    }
  }

  const onIdentityCreated = async (i: Identity) => {
    setIdentity(i);
    localStorage.setItem(identityKey, i.toString());
    const commitmentString = i.commitment.toString();

    const inGroup = _users.includes(commitmentString);
    setInGlobalGroup(inGroup);
    if (!inGroup) {
      joinGlobalGroup(commitmentString);
    }

    // Revert this code as the mumbai network doesn't work
    // try {
    //   // check if user in global group using API
    //   // to avoid user manipulate this check and join group more than once
    //   const response = await fetch("api/checkUserInGroup", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ identityCommitment: commitmentString })
    //   });

    //   if (response.status === 200) {
    //     const resJson = await response.json();
    //     const inGroup = resJson.userAlreadyInGroup;
    //     setInGlobalGroup(inGroup);
    //     if (!inGroup) {
    //       joinGlobalGroup(commitmentString);
    //     }
    //   }
    // } catch (error) {
    //   console.error('Something went wrong when check if user is in the group already')
    // }
  };

  const identityContext = useMemo(() => ({ identity, onIdentityCreated, inGlobalGroup }), [identity, onIdentityCreated, inGlobalGroup]);

  return (
    <IdentityContext.Provider value={identityContext}>
      {children}
    </IdentityContext.Provider>
  )
}
