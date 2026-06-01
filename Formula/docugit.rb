# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_03.48.53_b52bfd"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.48.53_b52bfd/docugit-darwin-arm64"
      sha256 "126db735a61f4a164f46d9140b6cd2c2156d6ee1bd32cee7abcbd0e3f8e20571"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.48.53_b52bfd/docugit-darwin-amd64"
      sha256 "793b8f249bb19252a8363b96a4e6dfdbf33ab2e39c17f9e5b5ffb3ee78aa18bb"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.48.53_b52bfd/docugit-linux-arm64"
      sha256 "6bce8d5ca650cb670e5f6219c335a0e52f361a0aa6065fbf0c845a9711956854"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_03.48.53_b52bfd/docugit-linux-amd64"
      sha256 "cb21e68e01846d38be9320b3cc4bc7835d782b09a354419e55ae12eb6fd67610"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
