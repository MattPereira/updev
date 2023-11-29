import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ERC725, ERC725JSONSchema } from "@erc725/erc725.js";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ConnectSocialAccounts } from "~~/components/updev/";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { convertIpfsUrl } from "~~/utils/helpers";

// TODO change to viem?

interface Accounts {
  [key: string]: string;
}

const Profile: NextPage = () => {
  const router = useRouter();
  const address = Array.isArray(router.query.address) ? router.query.address[0] : router.query.address || "";
  const [metadata, setMetadata] = useState<any>(null);
  const account = useAccount();

  const { data: profile } = useScaffoldContractRead({
    contractName: "upRegistry",
    functionName: "up",
    args: [address],
  });

  const { data: myProfile } = useScaffoldContractRead({
    contractName: "upRegistry",
    functionName: "upByEOA",
    args: [account.address],
  });

  const { data: tokenIdsOf } = useScaffoldContractRead({
    contractName: "upDevAccountOwnership",
    functionName: "tokenIdsOf",
    args: [address],
  });

  const { data: tokensData } = useScaffoldContractRead({
    contractName: "upDevAccountOwnership",
    functionName: "getDataBatch",
    args: [tokenIdsOf],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Accounts>({});

  // TODO check LSP24 ref on Lukso Mainnet UP and return 404 if refs are not consistent

  useEffect(() => {
    if (!tokensData) {
      return;
    }
    console.log("tokensData", tokensData);
    tokensData.forEach(d => {
      const [source, id] = ethers.utils.defaultAbiCoder.decode(["string", "string"], d);
      accounts[source] = id;
      setAccounts(accounts);
    });
  }, [tokensData, accounts]);

  useEffect(() => {
    console.log("accounts", accounts);
  }, [accounts]);

  useEffect(() => {
    if (profile) {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    async function fetchData(_address: string) {
      if (_address) {
        const lsp3ProfileSchemaModule = await import("@erc725/erc725.js/schemas/LSP3ProfileMetadata.json");
        const lsp3ProfileSchema = lsp3ProfileSchemaModule.default;
        const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], _address, "https://rpc.lukso.gateway.fm", {
          ipfsGateway: "https://api.universalprofile.cloud/ipfs",
        });
        try {
          const profileMetaData = await erc725js.fetchData("LSP3Profile");
          setMetadata(profileMetaData.value);
        } catch (error) {
          console.error("Error fetching ERC725 data:", error);
        }
      }
    }
    if (!isLoading && profile) {
      fetchData(profile[2]);
    }
  }, [isLoading, profile]);

  if (!metadata) {
    return (
      <div className="flex justify-center grow">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10">
      <div className="max-w-3xl flex flex-col" style={{ minWidth: "48rem" }}>
        <div className="relative mb-3">
          <div className="w-full h-[200px] bg-base-200 rounded-xl overflow-hidden relative">
            <Image
              alt="cover picture"
              fill
              src={convertIpfsUrl(metadata.LSP3Profile.backgroundImage[1].url)}
              className="object-cover object-center"
            />
          </div>
          <div className="absolute -bottom-16 left-5 w-32">
            <div className="rounded-full overflow-hidden w-full h-full border-[4px] border-base-300">
              <Image
                alt="profile picture"
                width={500}
                height={500}
                src={convertIpfsUrl(metadata.LSP3Profile.profileImage[0].url)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 mb-10 w-full pl-40">
          <div>
            <h3 className="text-2xl mb-0 font-bold">{metadata.LSP3Profile.name}</h3>
          </div>
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                <div className="text-[#FFFFFFA3]">@{metadata.LSP3Profile.name}</div>
                <div className="text-[#FFFFFF5C]">#{address.slice(2, 6)}</div>
              </div>
              <div className="text-[#FFFFFFA3]">{"\u2022"}</div>
              <div className="bg-base-100 border border-base-200 rounded-sm px-2 p-0.5">
                🆙 <span className="text-[#FFFFFFA3]">{address.slice(0, 6) + "..." + address.slice(-4)}</span>
              </div>
              {accounts["github"] && (
                <>
                  <div className="text-[#FFFFFFA3]">{"\u2022"}</div>
                  <a
                    href={"https://github.com/" + accounts["github"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <div>
                      <Image width={14} height={14} alt="achievement icon" src="/link.svg" />
                    </div>
                    <div className="text-[#FFFFFFA3] underline mr-2">GitHub</div>
                  </a>
                </>
              )}
              {accounts["buidlguidl"] && (
                <>
                  <div className="text-[#FFFFFFA3]">{"\u2022"}</div>
                  <a
                    href={"https://app.buidlguidl.com/builders/" + accounts["github"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <div>
                      <Image width={14} height={14} alt="achievement icon" src="/link.svg" />
                    </div>
                    <div className="text-[#FFFFFFA3] underline mr-2">BuidlGuidl</div>
                  </a>
                </>
              )}
              {/* {metadata.LSP3Profile.links.map((link: { title: string; url: string }, index: number) => (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={link.title}
                  className="flex items-center gap-1"
                >
                  <div>
                    <Image width={14} height={14} alt="achievement icon" src="/link.svg" />
                  </div>
                  <div className="text-[#FFFFFFA3] underline mr-2">{link.title}</div>
                  {index < metadata.LSP3Profile.links.length - 1 && <div className="text-[#FFFFFFA3]">{"\u2022"}</div>}
                </a>
              ))} */}
            </div>
          </div>
          <div>
            <div className="text-[#FFFFFFA3]">Bio</div>
            <div>{metadata.LSP3Profile.description}</div>
          </div>
          <div className="flex gap-2">
            {metadata.LSP3Profile.tags.map((tag: string) => (
              <div
                key={tag}
                className="text-accent font-semibold bg-base-100 px-2 py-0.5 rounded-md border border-base-200"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-3">Achievements</h3>
          <div className="flex gap-3">
            <div className="tooltip tooltip-primary" data-tip="Universal Profile Owner">
              <Image width={117} height={117} alt="achievement icon" src="/achievements/up.svg" />
            </div>
            <div className="tooltip tooltip-primary" data-tip="upDev Early Adopter">
              <Image width={117} height={117} alt="achievement icon" src="/achievements/og-updev.svg" />
            </div>
            {accounts["github"] && (
              <div className="tooltip tooltip-primary" data-tip="Verified GitHub Account">
                <Image width={117} height={117} alt="achievement icon" src="/achievements/github.svg" />
              </div>
            )}
            {accounts["buidlguidl"] && (
              <div className="tooltip tooltip-primary" data-tip="Verified BuidlGuidl Account">
                <Image width={117} height={117} alt="achievement icon" src="/achievements/buidlguidl.svg" />
              </div>
            )}
            {/* <Image width={117} height={117} alt="achievement icon" src="/achievements/buildbox.svg" /> */}
          </div>
        </div>

        {myProfile && address == myProfile[0] && (
          <div>
            <h3 className="text-2xl font-bold mb-3">Connect accounts</h3>
            <ConnectSocialAccounts />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
