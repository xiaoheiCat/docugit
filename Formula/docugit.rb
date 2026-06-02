# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_12.55.52_5a3b72"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_12.55.52_5a3b72/docugit-darwin-arm64"
      sha256 "8a58a4aab5a50ba01cf4f693e65dc9adf5e517a4e08c8e1c41dfa378b632e646"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_12.55.52_5a3b72/docugit-darwin-amd64"
      sha256 "352ea066bc5b483010c80a5b49514d867e237472e8861a30afc7d00003d6cdef"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_12.55.52_5a3b72/docugit-linux-arm64"
      sha256 "5f20f244a54ecbd34c7653a59a3863ea75eda1e6ffd9f02bd3829727916dad18"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_12.55.52_5a3b72/docugit-linux-amd64"
      sha256 "d797b56121012dc64d3c07c55ff0aa82c829d7a200a95c68cbb5ba155dc9094b"
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
