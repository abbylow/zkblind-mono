import React, {
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect
} from "react";
import { Identity } from "@semaphore-protocol/identity";

import SemaphoreContext from "@/context/SemaphoreContext";
import { notifyError } from "@/utils/notification";

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

const identityKey = "global-identity";

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
      const response = await fetch("api/joinAutotask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityCommitment: commitmentString
        })
      })

      if (response.status === 200) {
        const resJson = await response.json();
        addUser(commitmentString);
        setInGlobalGroup(resJson.inGroup);
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

  };

  const identityContext = useMemo(() => ({ identity, onIdentityCreated, inGlobalGroup }), [identity, onIdentityCreated, inGlobalGroup]);

  return (
    <IdentityContext.Provider value={identityContext}>
      {children}
    </IdentityContext.Provider>
  )
}
