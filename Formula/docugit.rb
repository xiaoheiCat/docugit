# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_01.53.11_70724d"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_01.53.11_70724d/docugit-darwin-arm64"
      sha256 "83c8ce3be704d633b31381f21bfd96874871e0d1a7417704781e7afc67ae545a"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_01.53.11_70724d/docugit-darwin-amd64"
      sha256 "8c6321fdbc12bf55281867f4ec58aac3766efd3500f21e3e3c9bbe7c627eb223"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_01.53.11_70724d/docugit-linux-arm64"
      sha256 "1ffe5f7db635e31a6f969c417983e4dcb70f407853316bc702ea79479e0c178d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_01.53.11_70724d/docugit-linux-amd64"
      sha256 "b8b60ba04dd15ee5e190aee3640a9eacb918b37c148a2635276e4c36f35488e4"
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
