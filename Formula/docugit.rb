# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_09.28.31_163acd"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.28.31_163acd/docugit-darwin-arm64"
      sha256 "d4ee68b004ea9f5ad9bdd11f8e9ab1869b8e4bc3c65ca111bd08e542b77ef1fe"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.28.31_163acd/docugit-darwin-amd64"
      sha256 "af602705aac7e3483af1ba1afee881e90210e6aead583d3cc76d8dee6e3c0a02"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.28.31_163acd/docugit-linux-arm64"
      sha256 "f9c94a85fb821e6d1f3a909dc2b09d2b358d3492dddcf6c1e36d9628d8f2f093"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_09.28.31_163acd/docugit-linux-amd64"
      sha256 "bac9fe841a6b78c1d164f313d7039f72cdecf642f5d715c773f15905cb3fd366"
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
